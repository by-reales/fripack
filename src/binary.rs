use anyhow::{Context, Result};
#[repr(C, packed)]
#[derive(Debug, Clone, Copy)]
pub struct EmbeddedConfig {
    pub magic1: i32,
    pub magic2: i32,
    pub version: i32,
    pub data_size: i32,
    pub data_offset: i32,
    pub data_xz: bool,
}

impl Default for EmbeddedConfig {
    fn default() -> Self {
        Self {
            magic1: 0x0d000721,
            magic2: 0x1f8a4e2b,
            version: 1,
            data_size: 0,
            data_offset: 0,
            data_xz: false,
        }
    }
}

impl EmbeddedConfig {
    pub fn new(data_size: i32, data_offset: i32, data_xz: bool) -> Self {
        Self {
            magic1: 0x0d000721,
            magic2: 0x1f8a4e2b,
            version: 1,
            data_size,
            data_offset,
            data_xz,
        }
    }

    pub fn as_bytes(&self) -> Vec<u8> {
        let mut bytes = vec![0; std::mem::size_of::<EmbeddedConfig>()];
        unsafe {
            let ptr = self as *const EmbeddedConfig as *const u8;
            std::ptr::copy_nonoverlapping(
                ptr,
                bytes.as_mut_ptr(),
                std::mem::size_of::<EmbeddedConfig>(),
            );
        }
        bytes
    }
}

pub struct BinaryProcessor {
    data: Vec<u8>,
}

impl BinaryProcessor {
    pub fn new(data: Vec<u8>) -> Result<Self> {
        if data.len() < 16 || &data[0..4] != b"\x7fELF" {
            anyhow::bail!("Invalid ELF binary");
        }

        Ok(Self { data })
    }

    pub fn find_embedded_config(&self) -> Option<usize> {
        let magic1_bytes = (0x0d000721i32).to_le_bytes();
        let magic2_bytes = (0x1f8a4e2bi32).to_le_bytes();

        for i in 0..self
            .data
            .len()
            .saturating_sub(std::mem::size_of::<EmbeddedConfig>())
        {
            if self.data[i..i + 4] == magic1_bytes && self.data[i + 4..i + 8] == magic2_bytes {
                return Some(i);
            }
        }

        None
    }

    pub fn add_embedded_config_data(&mut self, config_data: &[u8], use_xz: bool) -> Result<()> {
        let embedded_config_offset = self
            .find_embedded_config()
            .context("Could not find embedded config magic in binary")?;
        let embedded_config = if use_xz {
            let compressed_data = self.compress_xz(config_data)?;
            let offset = self.data.len();
            self.data.extend_from_slice(&compressed_data);
            EmbeddedConfig::new(
                compressed_data.len() as i32,
                offset as i32,
                use_xz,
            )
        } else {
            let offset = self.data.len();
            self.data.extend_from_slice(config_data);
            EmbeddedConfig::new(
                config_data.len() as i32,
                offset as i32,
                use_xz,
            )
        };

        let embedded_config_bytes = embedded_config.as_bytes();

        self.data[embedded_config_offset..embedded_config_offset + embedded_config_bytes.len()]
            .copy_from_slice(&embedded_config_bytes);

        Ok(())
    }

    fn compress_xz(&self, data: &[u8]) -> Result<Vec<u8>> {
        use std::io::Write;
        use xz2::write::XzEncoder;

        let mut encoder = XzEncoder::new(Vec::new(), 6);
        encoder.write_all(data)?;
        Ok(encoder.finish()?)
    }

    pub fn into_data(self) -> Vec<u8> {
        self.data
    }
}
